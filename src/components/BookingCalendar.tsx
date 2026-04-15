import React, { useState, useEffect } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday, addDays, isBefore, startOfToday, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

interface BookingCalendarProps {
  onDateSelect?: (date: Date) => void;
  isAdmin?: boolean;
}

export const BookingCalendar: React.FC<BookingCalendarProps> = ({ onDateSelect, isAdmin = false }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [availability, setAvailability] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'bookings'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Record<string, string> = {};
      snapshot.docs.forEach(doc => {
        const booking = doc.data();
        data[booking.date] = booking.status;
      });
      setAvailability(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'bookings');
    });

    return () => unsubscribe();
  }, []);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const getStatus = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    return availability[dateStr] || 'booked'; // Default to booked
  };

  const handleDateClick = (day: Date) => {
    if (isBefore(day, startOfToday())) return;
    
    setSelectedDate(day);
    if (onDateSelect) onDateSelect(day);
  };

  const weekDays = ['日', '月', '火', '水', '木', '金', '土'];

  return (
    <div className="w-full max-w-md mx-auto bg-[#222] rounded-sm border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <h2 className="text-lg font-light tracking-[0.2em] text-white">
          {format(currentMonth, 'yyyy年 M月', { locale: ja })}
        </h2>
        <div className="flex gap-2">
          <button 
            onClick={prevMonth}
            className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/60 hover:text-white"
          >
            <ChevronLeft size={18} />
          </button>
          <button 
            onClick={nextMonth}
            className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/60 hover:text-white"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Weekdays */}
      <div className="grid grid-cols-7 border-b border-white/5">
        {weekDays.map((day, index) => (
          <div 
            key={day} 
            className={`py-3 text-center text-[10px] font-medium tracking-widest uppercase ${
              index === 0 ? 'text-red-400/60' : index === 6 ? 'text-blue-400/60' : 'text-[#888]'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7">
        {calendarDays.map((day, i) => {
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isPast = isBefore(day, startOfToday());
          const status = getStatus(day);
          const isBooked = status === 'booked';
          const today = isToday(day);

          return (
            <button
              key={day.toString()}
              disabled={!isAdmin && (isPast || isBooked)}
              onClick={() => handleDateClick(day)}
              className={`
                relative h-16 flex flex-col items-center justify-center transition-all duration-300 py-2
                ${!isCurrentMonth ? 'opacity-20' : 'opacity-100'}
                ${isSelected ? 'bg-[#c08457] text-white' : 'hover:bg-white/5 text-[#ccc]'}
                ${!isAdmin && (isPast || isBooked) ? 'cursor-not-allowed opacity-30' : 'cursor-pointer'}
              `}
            >
              <span className={`text-sm font-light mb-1 ${today ? 'text-[#c08457] font-medium underline underline-offset-4' : ''}`}>
                {format(day, 'd')}
              </span>
              
              <div className="h-5 flex items-end justify-center pb-1">
                {isBooked ? (
                  <span className="text-[10px] text-red-500/80 font-bold">
                    ×
                  </span>
                ) : !isPast && isCurrentMonth ? (
                  <span className="text-[10px] text-[#c08457]/80 font-bold">
                    ○
                  </span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="px-6 py-4 bg-black/20 flex justify-center gap-6 text-[10px] tracking-widest text-[#666] uppercase">
        <div className="flex items-center gap-2">
          <span className="text-[#c08457] font-bold">○</span>
          <span>空室</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-red-500/80 font-bold">×</span>
          <span>満室</span>
        </div>
      </div>
    </div>
  );
};
