
export interface CurrentEntry {
  name: string;
  start: Date;
}

export interface LogEntry extends CurrentEntry {
  end: Date;
}
