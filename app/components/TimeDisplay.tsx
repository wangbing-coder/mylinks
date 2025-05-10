'use client'

import { Clock, Globe, CalendarIcon, Sun, Moon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type TimeDisplayProps = {
  timezone: string;
  title?: string;
  showLocation?: boolean;
};

export function TimeDisplay({ timezone, title, showLocation = true }: TimeDisplayProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const timeString = currentTime.toLocaleTimeString('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const dateString = currentTime.toLocaleDateString('en-US', {
    timeZone: timezone,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          {title || 'Current Time'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="text-5xl font-mono text-center">{timeString}</div>
          <div className="text-xl text-center">{dateString}</div>
          
          {showLocation && (
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Globe className="w-4 h-4" />
              <span>{timezone}</span>
            </div>
          )}
          
          {/* Additional time information can be added here */}
        </div>
      </CardContent>
    </Card>
  );
}
