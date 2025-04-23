// DataTable.jsx
import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

const DataTable = ({ data = [], columns = [], emptyMessage = "No data available" }) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return data;
    return [...data].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [data, sortConfig]);

  if (!data.length) {
    return <p className="text-gray-500 dark:text-gray-400 text-center py-4 text-sm">{emptyMessage}</p>;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-2 shadow-md overflow-x-auto text-sm">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={`px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider ${column.sortable ? 'cursor-pointer' : ''}`}
                onClick={() => column.sortable && handleSort(column.key)}
              >
                <div className="flex items-center">
                  {column.label}
                  {column.sortable && sortConfig.key === column.key && (
                    <span className="ml-1">
                      {sortConfig.direction === 'asc' ? 
                        <ChevronUp size={14} /> : 
                        <ChevronDown size={14} />
                      }
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {sortedData.map((item, index) => (
            <tr key={index} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'}>
              {columns.map((column) => (
                <td key={column.key} className="px-3 py-2 whitespace-nowrap text-xs text-gray-500 dark:text-gray-300">
                  {column.render ? column.render(item) : item[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;