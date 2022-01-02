import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {MayanService} from "./mayan.service";
import {Document} from "./model/Document";
import {forkJoin, mergeMap, Observable} from "rxjs";
import {Metadata} from "./model/Metadata";
import {map} from "rxjs/operators";

@Injectable({providedIn: 'root'})
export class MetadataService {
  constructor(private http: HttpClient, private mayan: MayanService) { }

  getAvailableMetadata(document: Document, documentTypeId: number): Observable<Metadata[]> {
    return new Observable<Metadata[]>(subscriber => {
      this.mayan.getDocumentTypeMetadata(documentTypeId)
        .subscribe(allAvailableMetadataTypes => {
          this.mayan.getDocumentMetadata(document)
            .subscribe(documentMetadata => {
              allAvailableMetadataTypes.forEach(availableMetadata => {
                let existingMetadataType = documentMetadata.filter(value => { return value.type.id == availableMetadata.type.id});

                if (existingMetadataType.length == 0) {
                  documentMetadata.push({
                    id: undefined,
                    type: availableMetadata.type,
                    value: null, // TODO: find date from OCR
                    required: availableMetadata.required,
                  });
                }
              });

              subscriber.next(documentMetadata);
            });
        })
    });
  }

  setDocumentMetadata(document: Document, metadata: Metadata[]): Observable<any[]> {
    return this.mayan.getDocumentMetadata(document)
      .pipe(map(documentMetadata => {
        let actions: Observable<any>[] = [];

        metadata.forEach(met => {
          let existingMetadataItem = documentMetadata.filter(item => {
            return item.type.id == met.type.id;
          });

          if (existingMetadataItem.length > 0) {

            let existingItemId = existingMetadataItem[0].id;
            if (!existingItemId) {
              return;
            }
            console.log('set ' + existingItemId);
            actions.push(this.mayan.setMetadataItem(document, existingItemId, met.value));
          } else {
            console.log('add ' + met.type.id);
            actions.push(this.mayan.addMetadataItem(document, met.type.id, met.value));
          }
        });

        return actions;
      })).pipe(mergeMap(actions => forkJoin(actions)));


  }
}
