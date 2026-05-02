export interface QTableRecord {
  state: string;
  action: string;
  value: number;
}

export function serializeQTable(records: readonly QTableRecord[]): string {
  return JSON.stringify(records, null, 2);
}
