import { Table } from "@shared/schema";

// Define common table dimensions
export const TABLE_WIDTH = 80;
export const TABLE_HEIGHT = 40;
// Adjust SVG dimensions to better fit the layout
export const SVG_WIDTH = 400;
export const SVG_HEIGHT = 360;

// Define status colors - should match Tailwind config
export const STATUS_COLORS = {
  available: "#55B978",  // Green
  busy: "#FF5252",       // Red
  inactive: "#9E9E9E"    // Gray
};

// Predefined table positions in the SVG - based on the reference image
export const TABLE_POSITIONS = [
  // Top row (tables 1, 2, 3)
  { x: 120, y: 30 },  // Table 1
  { x: 220, y: 30 },  // Table 2
  { x: 320, y: 30 },  // Table 3
  
  // Middle row (tables 4, 5)
  { x: 170, y: 130 }, // Table 4
  { x: 270, y: 130 }, // Table 5
  
  // Bottom row (tables 6, 7)
  { x: 170, y: 230 }, // Table 6
  { x: 270, y: 230 }, // Table 7
  
  // Left side vertical tables (tables 8, 9)
  { x: 30, y: 230 },  // Table 8
  { x: 30, y: 90 },   // Table 9
];

// Type for a table with position and orientation
export type TableWithPosition = Table & {
  position: { x: number, y: number };
  isVertical?: boolean;
};

// Process tables with their positions and orientations
export function processTablesWithPositions(tables: Table[]): TableWithPosition[] {
  return tables.map((table, index) => {
    // Use the position from our predefined layout or default to (0,0)
    const position = index < TABLE_POSITIONS.length 
      ? TABLE_POSITIONS[index]
      : { x: 0, y: 0 };
    
    // Tables 8 and 9 (indices 7 and 8) are vertical
    const isVertical = index === 7 || index === 8;
    
    return {
      ...table,
      position,
      isVertical
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
  const { position, isVertical } = table;
  
  if (isVertical) {
    // For vertical tables, swap width and height
    return (
      x >= position.x &&
      x <= position.x + TABLE_HEIGHT && // Use height as width
      y >= position.y &&
      y <= position.y + TABLE_WIDTH  // Use width as height
    );
  } else {
    // For horizontal tables (default)
    return (
      x >= position.x &&
      x <= position.x + TABLE_WIDTH &&
      y >= position.y &&
      y <= position.y + TABLE_HEIGHT
    );
  }
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
