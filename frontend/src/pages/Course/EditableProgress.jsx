import React, { useState, useEffect, useRef } from 'react';

// 可编辑进度组件
const EditableProgress = ({ current, total, onSave, isCompleted }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(current);
    const inputRef = useRef(null);

    useEffect(() => {
        setValue(current);
    }, [current]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleSave = () => {
        const numValue = parseInt(value) || 0;
        const clampedValue = Math.max(0, Math.min(numValue, total));
        onSave(clampedValue);
        setIsEditing(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleSave();
        if (e.key === 'Escape') {
            setValue(current);
            setIsEditing(false);
        }
    };

    if (isEditing) {
        return (
            <div className="flex items-center gap-1">
                <input
                    ref={inputRef}
                    type="number"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onBlur={handleSave}
                    onKeyDown={handleKeyDown}
                    className="w-12 text-center text-xs font-bold bg-white border border-indigo-300 rounded px-1 py-0.5 outline-none focus:border-indigo-500"
                    min={0}
                    max={total}
                />
                <span className="text-xs text-slate-500">/ {total}</span>
            </div>
        );
    }

    return (
        <span
            onClick={() => setIsEditing(true)}
            className={`text-xs font-bold min-w-[3rem] text-right cursor-pointer hover:bg-slate-100 rounded px-1 py-0.5 transition-colors ${isCompleted ? 'text-emerald-600' : 'text-slate-700'}`}
            title="点击编辑进度"
        >
            {current}/{total}
        </span>
    );
};

export default EditableProgress;