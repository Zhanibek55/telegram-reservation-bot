import { Table } from "@shared/schema";

// Define common table dimensions
export const TABLE_WIDTH = 80;
export const TABLE_HEIGHT = 40;
export const SVG_WIDTH = 300;
export const SVG_HEIGHT = 200;

// Define status colors - should match Tailwind config
export const STATUS_COLORS = {
  available: "#55B978",  // Green
  busy: "#FF5252",       // Red
  inactive: "#9E9E9E"    // Gray
};

// Predefined table positions in the SVG - this could be enhanced to be dynamic
export const TABLE_POSITIONS = [
  { x: 30, y: 30 },   // Table 1
  { x: 30, y: 100 },  // Table 2
  { x: 170, y: 30 },  // Table 3
  { x: 170, y: 100 }, // Table 4
];

// Type for a table with position
export type TableWithPosition = Table & {
  position: { x: number, y: number };
};

// Process tables with their positions
export function processTablesWithPositions(tables: Table[]): TableWithPosition[] {
  return tables.map((table, index) => {
    // Use the position from our predefined layout or default to (0,0)
    const position = index < TABLE_POSITIONS.length 
      ? TABLE_POSITIONS[index]
      : { x: 0, y: 0 };
    
    return {
      ...table,
      position
    };
  });
}

// Get fill color based on table status
export function getTableFillColor(status: string): string {
  return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || STATUS_COLORS.inactive;
}

// Get text color based on table status
export function getTableTextColor(status: string): string {
  return status === 'available' ? '#000000' : '#FFFFFF';
}

// Check if a point is inside a table's rectangle
export function isPointInTable(
  point: { x: number, y: number },
  table: TableWithPosition
): boolean {
  const { x, y } = point;
  const { position } = table;
  
  return (
    x >= position.x &&
    x <= position.x + TABLE_WIDTH &&
    y >= position.y &&
    y <= position.y + TABLE_HEIGHT
  );
}

// Find which table was clicked, if any
export function findClickedTable(
  point: { x: number, y: number },
  tables: TableWithPosition[]
): TableWithPosition | null {
  for (const table of tables) {
    if (isPointInTable(point, table)) {
      return table;
    }
  }
  return null;
}

// Convert mouse event coordinates to SVG coordinates
export function getSVGCoordinates(
  event: React.MouseEvent,
  svgElement: SVGSVGElement
): { x: number, y: number } {
  const rect = svgElement.getBoundingClientRect();
  const scaleX = SVG_WIDTH / rect.width;
  const scaleY = SVG_HEIGHT / rect.height;
  
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY
  };
}
