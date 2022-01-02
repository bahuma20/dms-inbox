import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {environment} from "../environments/environment";
import {Document} from "./model/Document";
import {File} from "./model/File";
import {Page} from "./model/Page";
import {Metadata} from "./model/Metadata";
import {MetadataType} from "./model/MetadataType";
import {DocumentType} from "./model/DocumentType";
import {map} from "rxjs/operators";

@Injectable({
  providedIn: 'root'
})
export class MayanService {
  constructor(private http: HttpClient) { }

  listInboxDocuments(): Observable<Document[]> {
    return new Observable<Document[]>(subscriber => {
      this.http.get(`${environment.apiUrl}/search/advanced/documents.DocumentSearchResult?document_type__label=INBOX`)
        .subscribe((data: any) => {
          const documents: Document[] = data.results.map((entry: any) => {
            return MayanService.parseDocument(entry);
          });

          subscriber.next(documents);
        });
    })
  }

  getDocument(documentId: number): Observable<Document> {
    return new Observable<Document>(subscriber => {
      this.http.get(`${environment.apiUrl}/documents/${documentId}/`)
        .subscribe((data: any) => {
          subscriber.next(MayanService.parseDocument(data));
        });
    })
  }

  getDocumentFilePages(document: Document, file: File) {
    return new Observable<Page[]>(subscriber => {
      this.http.get(`${environment.apiUrl}/documents/${document.id}/files/${file.id}/pages/`)
        .subscribe((data: any) => {
          subscriber.next(data.results.map((entry: any) => {
            const page: Page = {
              id: entry.id,
              page_number: entry.page_number,
            };

            return page;
          }));
        })
    })
  }

  getDocumentImage(document: Document, pageId: number, width?: number, height?: number): Observable<Blob> {
    return new Observable<Blob>(subscriber => {

      this.getDocumentFilePages(document, document.file_latest)
        .subscribe(pages => {
          let imageUrl = `${environment.apiUrl}/documents/${document.id}/files/${document.file_latest.id}/pages/${pages[0].id}/image/`;

          let url = new URL(imageUrl);
          if (width || height) {
            url.searchParams.append('transformation_0_name', 'resize');
          }
          if (width) {
            url.searchParams.append('transformation_0_argument__width', String(width));
          }

          if (height) {
            url.searchParams.append('transformation_0_argument__height', String(height));
          }

          this.http.get(url.toString(), {
            responseType: "blob"
          })
            .subscribe((value:any) => {
              subscriber.next(value)
            })
        });
    })
  }

  getAllDocumentTypes(): Observable<DocumentType[]> {
    return this.http.get(`${environment.apiUrl}/document_types/`)
      .pipe(map((data: any) => {
        return data.results.map((entry: any) => MayanService.parseDocumentType(entry));
      }))
  }

  getDocumentTypeMetadataTypes(documentTypeId: number): Observable<MetadataType[]> {
    return new Observable<MetadataType[]>(subscriber => {
      this.http.get(`${environment.apiUrl}/document_types/${documentTypeId}/metadata_types`)
        .subscribe((data: any) => {
          let metadataTypeList = data.results.map((entry: any) => {
            return MayanService.parseMetadataType(entry.metadata_type);
          });

          subscriber.next(metadataTypeList);
        });
    });
  }

  getDocumentMetadata(document: Document): Observable<Metadata[]> {
    return new Observable<Metadata[]>(subscriber => {
      this.http.get(`${environment.apiUrl}/documents/${document.id}/metadata`)
        .subscribe((data: any) => {
          let metadataList: Metadata[] = data.results.map((entry: any) => {
            let metadata: Metadata = {
              id: entry.id,
              type: MayanService.parseMetadataType(entry.metadata_type),
              value: entry.value,
            }

            return metadata;
          });

          subscriber.next(metadataList);
        });
    });
  }

  private static parseDocument(entry: any): Document {
    return {
      id: entry.id,
      uuid: entry.uuid,
      label: entry.label,
      datetime_created: new Date(entry.datetime_created),
      document_type: this.parseDocumentType(entry.document_type),
      file_latest: {
        id: entry.file_latest.id,
        timestamp: new Date(entry.file_latest.timestamp),
        filename: entry.file_latest.filename,
        file: entry.file_latest.file
      }
    };
  }

  private static parseDocumentType(entry: any): DocumentType {
    return {
      id: entry.id,
      label: entry.label,
    };
  }

  private static parseMetadataType(entry: any): MetadataType {
    return {
      id: entry.id,
      label: entry.label,
      name: entry.name,
      parser: entry.parser,
      validation: entry.validation,
      default: entry.default,
    }
  }

}
