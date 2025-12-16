import React, { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

const CustomDatePicker = ({ label, value, onChange, name, placeholder = "Select Date" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [view, setView] = useState('years'); // 'years', 'months', 'days'
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);
    const containerRef = useRef(null);

    // Initialize state from value prop
    useEffect(() => {
        if (value) {
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
                setSelectedDate(date);
                setCurrentDate(date);
            }
        }
    }, [value]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const handleYearSelect = (year) => {
        const newDate = new Date(currentDate);
        newDate.setFullYear(year);
        setCurrentDate(newDate);
        setView('months');
    };

    const handleMonthSelect = (monthIndex) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(monthIndex);
        setCurrentDate(newDate);
        setView('days');
    };

    const handleDaySelect = (day) => {
        const newDate = new Date(currentDate);
        newDate.setDate(day);
        setSelectedDate(newDate);

        // Format YYYY-MM-DD for the parent component
        const formattedDate = newDate.toISOString().split('T')[0];
        onChange({ target: { name, value: formattedDate } });
        setIsOpen(false);
    };

    const renderYears = () => {
        const currentYear = currentDate.getFullYear();
        const startYear = Math.floor(currentYear / 12) * 12;
        const years = [];
        for (let i = 0; i < 12; i++) {
            years.push(startYear + i);
        }

        return (
            <div className="grid grid-cols-3 gap-2">
                {years.map(year => (
                    <button
                        key={year}
                        onClick={() => handleYearSelect(year)}
                        className={`p-2 rounded-lg text-sm font-medium hover:bg-blue-50 hover:text-blue-600 transition-colors
                            ${currentDate.getFullYear() === year ? 'bg-blue-100 text-blue-700' : 'text-gray-700'}`}
                    >
                        {year}
                    </button>
                ))}
            </div>
        );
    };

    const renderMonths = () => {
        return (
            <div className="grid grid-cols-3 gap-2">
                {months.map((month, index) => (
                    <button
                        key={month}
                        onClick={() => handleMonthSelect(index)}
                        className={`p-2 rounded-lg text-sm font-medium hover:bg-blue-50 hover:text-blue-600 transition-colors
                            ${currentDate.getMonth() === index ? 'bg-blue-100 text-blue-700' : 'text-gray-700'}`}
                    >
                        {month.substring(0, 3)}
                    </button>
                ))}
            </div>
        );
    };

    const renderDays = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = getDaysInMonth(year, month);
        const firstDay = getFirstDayOfMonth(year, month);
        const days = [];

        // Empty slots for days before the 1st
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="p-2"></div>);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const isSelected = selectedDate &&
                selectedDate.getDate() === day &&
                selectedDate.getMonth() === month &&
                selectedDate.getFullYear() === year;

            days.push(
                <button
                    key={day}
                    onClick={() => handleDaySelect(day)}
                    className={`p-2 rounded-lg text-sm font-medium hover:bg-blue-50 hover:text-blue-600 transition-colors
                        ${isSelected ? 'bg-blue-600 text-white hover:bg-blue-700 hover:text-white' : 'text-gray-700'}`}
                >
                    {day}
                </button>
            );
        }

        return (
            <>
                <div className="grid grid-cols-7 gap-1 mb-2 text-center">
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                        <span key={d} className="text-xs font-medium text-gray-400">{d}</span>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-1 text-center">
                    {days}
                </div>
            </>
        );
    };

    const handleHeaderClick = () => {
        if (view === 'days') setView('months');
        else if (view === 'months') setView('years');
    };

    const handlePrev = (e) => {
        e.stopPropagation();
        const newDate = new Date(currentDate);
        if (view === 'years') newDate.setFullYear(newDate.getFullYear() - 12);
        else if (view === 'months') newDate.setFullYear(newDate.getFullYear() - 1);
        else newDate.setMonth(newDate.getMonth() - 1);
        setCurrentDate(newDate);
    };

    const handleNext = (e) => {
        e.stopPropagation();
        const newDate = new Date(currentDate);
        if (view === 'years') newDate.setFullYear(newDate.getFullYear() + 12);
        else if (view === 'months') newDate.setFullYear(newDate.getFullYear() + 1);
        else newDate.setMonth(newDate.getMonth() + 1);
        setCurrentDate(newDate);
    };

    const getHeaderText = () => {
        if (view === 'years') {
            const startYear = Math.floor(currentDate.getFullYear() / 12) * 12;
            return `${startYear} - ${startYear + 11}`;
        }
        if (view === 'months') return currentDate.getFullYear();
        return `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    };

    return (
        <div className="relative" ref={containerRef}>
            {label && <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>}
            <div
                className="relative group cursor-pointer"
                onClick={() => {
                    setIsOpen(!isOpen);
                    setView('years'); // Reset to years view on open as requested
                }}
            >
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Calendar className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </div>
                <input
                    type="text"
                    readOnly
                    value={selectedDate ? selectedDate.toLocaleDateString('en-IN') : ''}
                    placeholder={placeholder}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-600 transition-all outline-none bg-white cursor-pointer"
                />
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </div>

            {isOpen && (
                <div className="absolute z-50 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-100 p-4 animate-fadeIn">
                    <div className="flex items-center justify-between mb-4">
                        <button onClick={handlePrev} className="p-1 hover:bg-gray-100 rounded-full text-gray-500">
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            onClick={handleHeaderClick}
                            className="text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                        >
                            {getHeaderText()}
                        </button>
                        <button onClick={handleNext} className="p-1 hover:bg-gray-100 rounded-full text-gray-500">
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    <div className="min-h-[240px]">
                        {view === 'years' && renderYears()}
                        {view === 'months' && renderMonths()}
                        {view === 'days' && renderDays()}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomDatePicker;
