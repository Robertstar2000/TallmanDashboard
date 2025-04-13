import { useState, useEffect } from 'react';
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
export default function TimeDisplayApp() {
    const [isRealTime, setIsRealTime] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [workingTime, setWorkingTime] = useState(new Date());
    const [showRedDot, setShowRedDot] = useState(false);
    const [showGreenDot, setShowGreenDot] = useState(false);
    const [showBlueDot, setShowBlueDot] = useState(false);
    useEffect(() => {
        const realTimeInterval = setInterval(() => {
            const newCurrentTime = new Date();
            setCurrentTime(newCurrentTime);
            if (isRealTime) {
                setWorkingTime(newCurrentTime);
            }
        }, 1000);
        return () => clearInterval(realTimeInterval);
    }, [isRealTime]);
    return (<Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Time Display</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch id="real-time-mode" checked={isRealTime} onCheckedChange={setIsRealTime}/>
            <Label htmlFor="real-time-mode">Real-time Mode</Label>
          </div>

          <div className="text-2xl font-bold text-center">
            {workingTime.toLocaleTimeString()}
          </div>

          <div className="flex justify-center space-x-4">
            <div className={`w-4 h-4 rounded-full ${showRedDot ? 'bg-red-500' : 'bg-gray-200'}`}/>
            <div className={`w-4 h-4 rounded-full ${showGreenDot ? 'bg-green-500' : 'bg-gray-200'}`}/>
            <div className={`w-4 h-4 rounded-full ${showBlueDot ? 'bg-blue-500' : 'bg-gray-200'}`}/>
          </div>
        </div>
      </CardContent>
    </Card>);
}
