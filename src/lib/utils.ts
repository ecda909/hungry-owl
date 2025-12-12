import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  if (days < 0) {
    return `${Math.abs(days)} days ago`;
  } else if (days === 0) {
    return "Today";
  } else if (days === 1) {
    return "Tomorrow";
  } else if (days <= 7) {
    return `In ${days} days`;
  } else {
    return formatDate(date);
  }
}

export function getExpirationStatus(expirationDate: Date | null): "fresh" | "use_soon" | "expiring" | "expired" {
  if (!expirationDate) return "fresh";

  const now = new Date();
  const diff = expirationDate.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  if (days < 0) return "expired";
  if (days <= 1) return "expiring";
  if (days <= 3) return "use_soon";
  return "fresh";
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "fresh":
      return "text-green-600 bg-green-100";
    case "use_soon":
      return "text-yellow-600 bg-yellow-100";
    case "expiring":
      return "text-orange-600 bg-orange-100";
    case "expired":
      return "text-red-600 bg-red-100";
    default:
      return "text-gray-600 bg-gray-100";
  }
}

export function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export function scaleIngredientQuantity(
  quantity: number,
  originalServings: number,
  newServings: number
): number {
  return (quantity / originalServings) * newServings;
}

export function formatTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours} hr`;
  }
  return `${hours} hr ${mins} min`;
}

export function parseTimeToMinutes(timeStr: string): number {
  const hourMatch = timeStr.match(/(\d+)\s*h/i);
  const minMatch = timeStr.match(/(\d+)\s*m/i);
  
  let minutes = 0;
  if (hourMatch) minutes += parseInt(hourMatch[1]) * 60;
  if (minMatch) minutes += parseInt(minMatch[1]);
  
  return minutes || parseInt(timeStr) || 0;
}

