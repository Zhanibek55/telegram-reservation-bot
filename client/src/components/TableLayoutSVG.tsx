import { useRef, useCallback } from "react";
import { 
  TABLE_WIDTH, 
  TABLE_HEIGHT, 
  SVG_WIDTH, 
  SVG_HEIGHT,
  getTableFillColor,
  getTableTextColor,
  getSVGCoordinates,
  findClickedTable,
  processTablesWithPositions,
  type TableWithPosition
} from "@/lib/tableLayout";
import { Table } from "@shared/schema";

interface TableLayoutSVGProps {
  tables: Table[];
  onTableClick?: (table: Table) => void;
}

const TableLayoutSVG = ({ tables, onTableClick }: TableLayoutSVGProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  
  // Process tables to add position data
  const tablesWithPositions = processTablesWithPositions(tables);
  
  // Handle table click
  const handleClick = useCallback((event: React.MouseEvent) => {
    if (!svgRef.current || !onTableClick) return;
    
    const coordinates = getSVGCoordinates(event, svgRef.current);
    const clickedTable = findClickedTable(coordinates, tablesWithPositions);
    
    if (clickedTable) {
      onTableClick(clickedTable);
    }
  }, [tablesWithPositions, onTableClick]);
  
  return (
    <div className="relative bg-gray-100 p-3 rounded-lg mb-6 overflow-hidden">
      <h3 className="text-lg font-medium mb-2 text-center">Схема расположения столов</h3>
      <svg 
        ref={svgRef}
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} 
        className="w-full border border-gray-200 rounded-lg bg-gray-50"
        onClick={handleClick}
      >
        {/* Room walls/boundaries */}
        <line x1="100" y1="0" x2="100" y2={SVG_HEIGHT} stroke="#333" strokeWidth="3" />
        <line x1="0" y1="180" x2="100" y2="180" stroke="#333" strokeWidth="3" />
        
        {tablesWithPositions.map((table) => (
          <g 
            key={table.id}
            className={`cursor-pointer hover:opacity-90 transition-opacity ${
              table.status === "busy" || table.status === "inactive" ? "opacity-80" : ""
            }`}
            data-table-id={table.id}
            data-table-status={table.status}
          >
            {table.isVertical ? (
              // Vertical table
              <rect 
                x={table.position.x} 
                y={table.position.y} 
                width={TABLE_HEIGHT} // Swap width and height
                height={TABLE_WIDTH} 
                className="stroke-gray-800 stroke-2"
                fill={getTableFillColor(table.status)}
                rx="2"
              />
            ) : (
              // Horizontal table
              <rect 
                x={table.position.x} 
                y={table.position.y} 
                width={TABLE_WIDTH} 
                height={TABLE_HEIGHT} 
                className="stroke-gray-800 stroke-2"
                fill={getTableFillColor(table.status)}
                rx="2"
              />
            )}
            
            <text 
              x={table.position.x + (table.isVertical ? TABLE_HEIGHT : TABLE_WIDTH) / 2} 
              y={table.position.y + (table.isVertical ? TABLE_WIDTH : TABLE_HEIGHT) / 2 + 5} 
              className="text-center font-semibold"
              fill={getTableTextColor(table.status)}
              textAnchor="middle"
            >
              {table.number}
            </text>
          </g>
        ))}
      </svg>
      
      {/* Table status legend */}
      <div className="flex justify-center mt-3 space-x-4 text-xs">
        <div className="flex items-center">
          <span className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: "#55B978" }}></span>
          <span>Доступен</span>
        </div>
        <div className="flex items-center">
          <span className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: "#FF5252" }}></span>
          <span>Занят</span>
        </div>
        <div className="flex items-center">
          <span className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: "#9E9E9E" }}></span>
          <span>Недоступен</span>
        </div>
      </div>
    </div>
  );
};

export default TableLayoutSVG;
