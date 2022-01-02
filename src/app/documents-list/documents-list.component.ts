import { Component, OnInit } from '@angular/core';
import {MayanService} from "../mayan.service";
import {Document} from "../model/Document";

@Component({
  selector: 'app-documents-list',
  templateUrl: './documents-list.component.html',
  styleUrls: ['./documents-list.component.scss']
})
export class DocumentsListComponent implements OnInit {
  loading: boolean = false;
  documents: Document[] | undefined;

  constructor(private mayan: MayanService) { }

  ngOnInit(): void {
    this.loading = true;
    this.mayan.listInboxDocuments().subscribe(documents => {
      this.loading = false;
      this.documents = documents
    });
  }

}
