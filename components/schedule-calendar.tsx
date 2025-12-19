"use client";

import { useLayoutEffect, useRef, useState, useCallback } from "react";
import Calendar from "react-calendar";
import { motion, AnimatePresence, useMotionValue, animate } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Plus, X, User, Check, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { ScheduleWithUser, User as UserType } from "@/lib/types";
import { getTeamFunctionLabel } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { UserAvatar } from "@/components/user-avatar";

type ValuePiece = Date | null;
type Value = ValuePiece | [ValuePiece, ValuePiece];

interface ScheduleCalendarProps {
  schedules: ScheduleWithUser[];
  users: UserType[];
  currentUser: UserType;
  isAdmin: boolean;
}

export function ScheduleCalendar({
  schedules: initialSchedules,
  users,
  currentUser,
  isAdmin,
}: ScheduleCalendarProps) {
  const [date, setDate] = useState<Value>(new Date());
  const [schedules, setSchedules] =
    useState<ScheduleWithUser[]>(initialSchedules);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isAddingSchedules, setIsAddingSchedules] = useState(false);
  const supabase = createClient();

  const calendarMeasureRef = useRef<HTMLDivElement | null>(null);
  const [calendarContentHeight, setCalendarContentHeight] = useState<
    number | null
  >(null);

  // Swipe gesture handling for mobile
  const swipeX = useMotionValue(0);
  const swipeThreshold = 50;
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDragEnd = useCallback((_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    if (offset > swipeThreshold || velocity > 500) {
      // Swipe right - previous month
      const currentDate = date instanceof Date ? date : new Date();
      const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      setDate(prevMonth);
    } else if (offset < -swipeThreshold || velocity < -500) {
      // Swipe left - next month
      const currentDate = date instanceof Date ? date : new Date();
      const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
      setDate(nextMonth);
    }
    
    animate(swipeX, 0, { type: "spring", stiffness: 300, damping: 30 });
  }, [date, swipeX]);

  useLayoutEffect(() => {
    const element = calendarMeasureRef.current;
    if (!element) return;

    const update = () => {
      const next = Math.ceil(element.getBoundingClientRect().height);
      setCalendarContentHeight((prev) => (prev === next ? prev : next));
    };

    update();

    const ro = new ResizeObserver(() => update());
    ro.observe(element);
    return () => ro.disconnect();
  }, []);

  const selectedDate = date instanceof Date ? date : null;
  const selectedDateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : "";
  const scheduledForDate = schedules.filter((s) => s.date === selectedDateStr);

  // Get dates that have schedules as strings for easy comparison
  const scheduledDateStrings = schedules.map((s) => s.date);

  const handleAddSchedule = async (userId: string) => {
    if (!selectedDate || !isAdmin) return;

    const { data, error } = await supabase
      .from("schedules")
      .insert({
        date: selectedDateStr,
        user_id: userId,
        created_by: currentUser.id,
      })
      .select(
        `
        *,
        user:users!schedules_user_id_fkey(
          *,
          team_function:team_functions(*)
        )
      `
      )
      .single();

    if (error) {
      console.error("Erro ao adicionar escala:", error);
    }

    if (!error && data) {
      setSchedules([...schedules, data as ScheduleWithUser]);
    }

    return { data, error };
  };

  const handleAddMultipleSchedules = async () => {
    if (selectedUserIds.length === 0) return;
    
    setIsAddingSchedules(true);
    
    for (const userId of selectedUserIds) {
      await handleAddSchedule(userId);
    }
    
    setSelectedUserIds([]);
    setIsAddingSchedules(false);
    setIsAddDialogOpen(false);
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleRemoveSchedule = async (scheduleId: string) => {
    if (!isAdmin) return;

    const { error } = await supabase
      .from("schedules")
      .delete()
      .eq("id", scheduleId);

    if (!error) {
      setSchedules(schedules.filter((s) => s.id !== scheduleId));
    }
  };

  // Users not scheduled for selected date
  const availableUsers = users.filter(
    (u) => !scheduledForDate.some((s) => s.user_id === u.id)
  );

  // Check if a date has schedules
  const tileClassName = ({ date, view }: { date: Date; view: string }) => {
    if (view === "month") {
      const dateStr = format(date, "yyyy-MM-dd");
      if (scheduledDateStrings.includes(dateStr)) {
        return "has-schedule";
      }
    }
    return null;
  };

  const handlePrevMonth = () => {
    const currentDate = date instanceof Date ? date : new Date();
    const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    setDate(prevMonth);
  };

  const handleNextMonth = () => {
    const currentDate = date instanceof Date ? date : new Date();
    const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    setDate(nextMonth);
  };

  const currentMonth = date instanceof Date ? date : new Date();
  const monthYear = format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR });

  // Schedule list content (reusable for both desktop and drawer)
  const scheduleListContent = (
    <AnimatePresence mode="wait">
      {scheduledForDate.length === 0 ? (
        <motion.div 
          key="empty"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="text-center py-8 text-muted-foreground"
        >
          <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Nenhum usuário escalado para esta data.</p>
        </motion.div>
      ) : (
        <motion.div 
          key={selectedDateStr}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="space-y-2"
        >
          {scheduledForDate.map((schedule, index) => (
            <motion.div
              key={schedule.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ 
                duration: 0.2, 
                delay: index * 0.05 
              }}
              className="flex items-center justify-between p-3 rounded-lg bg-beje/50 border border-white/20"
            >
              <div className="flex items-center gap-3">
                <UserAvatar user={schedule.user} size="lg" />
                <div>
                  <p className="font-medium text-navy">
                    {schedule.user.full_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {getTeamFunctionLabel(schedule.user)}
                  </p>
                </div>
              </div>
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveSchedule(schedule.id)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Add dialog content (reusable)
  const addDialogContent = (
    <>
      <div className="grid gap-2 max-h-80 overflow-y-auto">
        {availableUsers.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            Todos os usuários já estão escalados para esta data.
          </p>
        ) : (
          availableUsers.map((user) => {
            const isSelected = selectedUserIds.includes(user.id);
            return (
              <button
                key={user.id}
                type="button"
                onClick={() => toggleUserSelection(user.id)}
                className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg border transition-colors text-left ${
                  isSelected
                    ? "bg-navy text-neve border-navy"
                    : "bg-neve hover:bg-beje border-beje hover:border-navy/30"
                }`}
              >
                <div className="relative">
                  <UserAvatar user={user} size="md" className={isSelected ? "ring-2 ring-neve" : ""} />
                  {isSelected && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium truncate ${isSelected ? "text-neve" : "text-navy"}`}>
                    {user.full_name}
                  </p>
                  <p className={`text-xs truncate ${isSelected ? "text-neve/80" : "text-neve"}`}
                     style={{ color: isSelected ? undefined : user.team_function?.color || '#6B7280' }}>
                    {getTeamFunctionLabel(user)}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>
      {availableUsers.length > 0 && (
        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            onClick={() => {
              setSelectedUserIds([]);
              setIsAddDialogOpen(false);
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleAddMultipleSchedules}
            disabled={selectedUserIds.length === 0 || isAddingSchedules}
            className="bg-navy hover:bg-navy/90"
          >
            {isAddingSchedules
              ? "Adicionando..."
              : `Adicionar ${selectedUserIds.length > 0 ? `(${selectedUserIds.length})` : ""}`}
          </Button>
        </DialogFooter>
      )}
    </>
  );

  return (
    <>
      {/* Desktop Layout */}
      <div className="hidden lg:flex gap-4 h-full">
        {/* Calendar - 70% */}
        <div className="w-[70%] backdrop-blur-md overflow-hidden flex flex-col">
          <div className="px-4 py-3 flex items-center justify-between">
            <h2 className="text-3xl font-bold text-navy capitalize">{monthYear}</h2>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrevMonth}
                className="text-navy hover:bg-navy/10"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNextMonth}
                className="text-navy hover:bg-navy/10"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
          <div className="flex-1 p-4 rounded-lg backdrop-blur-md bg-neve">
            <motion.div
              className="overflow-hidden"
              animate={
                calendarContentHeight == null
                  ? undefined
                  : { height: calendarContentHeight }
              }
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 35,
                mass: 0.6,
              }}
              style={{
                height: calendarContentHeight == null ? "auto" : undefined,
              }}
            >
              <div ref={calendarMeasureRef} className="w-full">
                <Calendar
                  onChange={setDate}
                  value={date}
                  locale="pt-BR"
                  tileClassName={tileClassName}
                  className="custom-calendar"
                />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Schedule List - 30% */}
        <div className="w-[30%] backdrop-blur-md overflow-hidden flex flex-col">
          <div className="px-4 py-3.5 flex flex-row items-center justify-between">
            <h2 className="text-lg font-bold text-navy">
              {selectedDate
                ? format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                : "Selecione uma data"}
            </h2>
            {isAdmin && selectedDate && (
              <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
                setIsAddDialogOpen(open);
                if (!open) setSelectedUserIds([]);
              }}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-navy hover:bg-navy/90">
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adicionar à Escala</DialogTitle>
                  </DialogHeader>
                  {addDialogContent}
                </DialogContent>
              </Dialog>
            )}
          </div>
          <motion.div layoutScroll className="flex-1 overflow-auto rounded-lg bg-neve p-4">
            {scheduleListContent}
          </motion.div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="flex lg:hidden flex-col min-h-[calc(100vh-5rem)]">
        {/* Calendar Header */}
        <div className="px-4 py-1">
          <h2 className="text-2xl font-bold text-navy capitalize">{monthYear}</h2>
        </div>
        
        {/* Calendar with swipe gestures */}
        <motion.div 
          ref={containerRef}
          className="overflow-hidden touch-pan-y shrink-0 px-2"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          style={{ x: swipeX }}
        >
          <div className="w-full">
            <Calendar
              onChange={(value) => {
                setDate(value);
              }}
              value={date}
              locale="pt-BR"
              tileClassName={tileClassName}
              className="custom-calendar mobile-calendar"
            />
          </div>
        </motion.div>

        {/* Bottom Sheet - fills remaining space */}
        <div className="flex-1 bg-neve rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.1)] flex flex-col min-h-50 -mt-2">
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
          </div>
          
          {/* Header */}
          <div className="px-4 pb-3 flex items-center justify-between shrink-0">
            <h3 className="text-lg font-bold text-navy">
              {selectedDate
                ? format(selectedDate, "dd 'de' MMMM", { locale: ptBR })
                : "Selecione uma data"}
            </h3>
            {isAdmin && selectedDate && (
              <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
                setIsAddDialogOpen(open);
                if (!open) setSelectedUserIds([]);
              }}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-navy hover:bg-navy/90">
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adicionar à Escala</DialogTitle>
                  </DialogHeader>
                  {addDialogContent}
                </DialogContent>
              </Dialog>
            )}
          </div>
          
          {/* Content */}
          <div className="px-4 pb-20 overflow-y-auto flex-1">
            {scheduleListContent}
          </div>
        </div>
      </div>
    </>
  );
}
