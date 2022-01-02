import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {MayanService} from "./mayan.service";
import {Document} from "./model/Document";
import {Observable} from "rxjs";
import {Metadata} from "./model/Metadata";

@Injectable({providedIn: 'root'})
export class MetadataService {
  constructor(private http: HttpClient, private mayan: MayanService) { }

  getAvailableMetadata(document: Document, documentTypeId: number): Observable<Metadata[]> {
    return new Observable<Metadata[]>(subscriber => {
      this.mayan.getDocumentTypeMetadataTypes(documentTypeId)
        .subscribe(allAvailableMetadataTypes => {
          this.mayan.getDocumentMetadata(document)
            .subscribe(documentMetadata => {
              allAvailableMetadataTypes.forEach(availableMetadataType => {
                let existingMetadataType = documentMetadata.filter(value => { return value.type.id == availableMetadataType.id});

                if (existingMetadataType.length == 0) {
                  documentMetadata.push({
                    id: undefined,
                    type: availableMetadataType,
                    value: null, // TODO: find date from OCR
                    required: false,
                  });
                }
              });

              subscriber.next(documentMetadata);
            });
        })
    });
  }
}
