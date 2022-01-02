import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable} from "rxjs";
import {environment} from "../environments/environment";
import {Document} from "./model/Document";
import {File} from "./model/File";
import {Page} from "./model/Page";

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
      this.http.get(`${environment.apiUrl}/documents/${documentId}`)
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
            console.log(entry);
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

  private static parseDocument(entry: any): Document {
    return {
      id: entry.id,
      uuid: entry.uuid,
      label: entry.label,
      datetime_created: new Date(entry.datetime_created),
      document_type: {
        id: entry.document_type.id,
        label: entry.document_type.label,
      },
      file_latest: {
        id: entry.file_latest.id,
        timestamp: new Date(entry.file_latest.timestamp),
        filename: entry.file_latest.filename,
        file: entry.file_latest.file
      }
    };
  }

}
