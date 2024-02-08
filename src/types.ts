type SeriesSize = 'sm' | 'md' | 'lg';

export interface SimpleOptions {
  customConfig: string;
  datasource: string;
  remote: URL;
  text: string;
  showSeriesCount: boolean;
  seriesCountSize: SeriesSize;
}
