import {File} from "./File";

export interface Document {
  id: number;

  uuid: string;

  label: string;

  datetime_created: Date;

  document_type: {
    id: number;
    label: string;
  };

  file_latest: File;
}
