import {Injectable} from "@angular/core";
import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse} from "@angular/common/http";
import {Observable, of} from "rxjs";
import {tap} from "rxjs";
import {share} from "rxjs";

@Injectable()
export class ImageCachingInterceptor implements HttpInterceptor {
  private cache: Map<string, HttpResponse<any>> = new Map();

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Delete cached images, once the documents are reviewed
    if (req.method === 'POST' && req.url.indexOf('/type/change/') !== -1) {
      let documentId = ImageCachingInterceptor.extractDocumentId(req.url);
      if (!documentId) {
        return next.handle(req);
      }

      let cachedItems = [...this.cache.keys()];
      cachedItems.forEach(key => {
        if (key.indexOf('/documents/' + documentId + '/files') !== -1) {
          this.cache.delete(key);
        }
      })

      return next.handle(req);
    }

    if (req.method !== 'GET' || req.url.indexOf('image') == -1) {
      return next.handle(req);
    }

    // Load image from cache instead of server if already existing
    const cachedResponse: HttpResponse<any> | undefined = this.cache.get(req.url);

    if (cachedResponse) {
      return of(cachedResponse.clone());
    } else {
      return next.handle(req)
        .pipe(
          tap(stateEvent => {
            if (stateEvent instanceof HttpResponse) {
                this.cache.set(req.url, stateEvent.clone());
                console.log(this.cache);
            }
          })
        ).pipe(
          share()
        )
    }
  }

  private static extractDocumentId(url: string) {
    let expression = /\/documents\/(\d*)\//g;
    let matches = expression.exec(url);

    if (!matches) {
      return false;
    }

    return matches[1];
  }
}
