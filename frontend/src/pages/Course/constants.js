// 预设颜色列表
export const PRESET_COLORS = [
    { name: '默认', value: null, bg: 'bg-white/60', text: 'text-slate-800' },
    { name: '靛蓝', value: 'indigo', bg: 'bg-indigo-50/80', text: 'text-indigo-900' },
    { name: '翠绿', value: 'emerald', bg: 'bg-emerald-50/80', text: 'text-emerald-900' },
    { name: '琥珀', value: 'amber', bg: 'bg-amber-50/80', text: 'text-amber-900' },
    { name: '玫红', value: 'rose', bg: 'bg-rose-50/80', text: 'text-rose-900' },
    { name: '天蓝', value: 'sky', bg: 'bg-sky-50/80', text: 'text-sky-900' },
    { name: '紫罗兰', value: 'violet', bg: 'bg-violet-50/80', text: 'text-violet-900' },
    { name: '青色', value: 'cyan', bg: 'bg-cyan-50/80', text: 'text-cyan-900' },
    { name: '橙色', value: 'orange', bg: 'bg-orange-50/80', text: 'text-orange-900' },
];

// 获取颜色样式
export const getColorStyles = (colorValue) => {
    const color = PRESET_COLORS.find(c => c.value === colorValue) || PRESET_COLORS[0];
    return color;
};