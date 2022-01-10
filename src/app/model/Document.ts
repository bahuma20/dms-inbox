import {File} from "./File";
import {DocumentType} from "./DocumentType";
import {Version} from "./Version";

export interface Document {
  id: number;

  uuid: string;

  label: string;

  datetime_created: Date;

  document_type: DocumentType;

  file_latest: File;

  version_active: Version;
}
