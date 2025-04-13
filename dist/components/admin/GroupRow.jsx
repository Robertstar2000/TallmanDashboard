'use client';
import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
export function GroupRow({ group, count, isExpanded, onToggle }) {
    return (<tr className="bg-gray-50 hover:bg-gray-100 cursor-pointer" onClick={onToggle}>
      <td className="p-4 align-middle w-[80px]">
        {isExpanded ? (<ChevronDown className="h-4 w-4"/>) : (<ChevronRight className="h-4 w-4"/>)}
      </td>
      <td colSpan={8} className="p-4 align-middle font-medium">
        {group} ({count} variables)
      </td>
    </tr>);
}
