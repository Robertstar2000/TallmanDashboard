import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SaveIcon } from 'lucide-react';
export function EditableSqlCell({ value, onSave }) {
    const [isEditing, setIsEditing] = React.useState(false);
    const [editValue, setEditValue] = React.useState(value);
    const handleSave = () => {
        onSave(editValue);
        setIsEditing(false);
    };
    if (isEditing) {
        return (<div className="flex items-center gap-1">
        <Input value={editValue} onChange={(e) => setEditValue(e.target.value)} className="h-6 text-[9px] font-mono p-1 flex-1" autoFocus onBlur={handleSave} onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    handleSave();
                }
            }}/>
        <Button size="sm" variant="ghost" className="h-6 w-6 p-0 hover:bg-slate-100" onClick={handleSave}>
          <SaveIcon className="h-3 w-3 text-blue-600"/>
        </Button>
      </div>);
    }
    return (<div className="flex items-center gap-1 group cursor-text" onClick={() => setIsEditing(true)}>
      <div className="flex-1 font-mono text-[9px]">{value}</div>
      <Button size="sm" variant="ghost" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-slate-100" onClick={(e) => {
            e.stopPropagation();
            setIsEditing(true);
        }}>
        <SaveIcon className="h-3 w-3 text-blue-600"/>
      </Button>
    </div>);
}
