import {Component, Input, OnInit} from '@angular/core';
import {Document} from "../model/Document";
import {MayanService} from "../mayan.service";
import {DomSanitizer, SafeResourceUrl} from "@angular/platform-browser";

@Component({
  selector: 'app-document',
  templateUrl: './document.component.html',
  styleUrls: ['./document.component.scss']
})
export class DocumentComponent implements OnInit {

  @Input("document") document: Document | undefined;

  imageUrl: SafeResourceUrl | undefined;

  constructor(private mayan: MayanService, private sanitizer: DomSanitizer) {
  }

  ngOnInit(): void {
    if (!this.document) {
      return;
    }

    this.mayan.getDocumentFilePages(this.document, this.document.file_latest)
      .subscribe(pages => {
        if (!this.document) {
          return;
        }

        this.mayan.getDocumentImage(this.document, pages[0].id, 200)
          .subscribe(image => {
            this.imageUrl = this.sanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(image));
          })
      })

    this.mayan.getDocumentImage(this.document, 200)


  }

}
