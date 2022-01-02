import {MetadataType} from "./MetadataType";

export interface Metadata {
  id?: number;

  type: MetadataType

  value?: any;

  required: boolean;
}
