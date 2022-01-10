import {Injectable} from "@angular/core";
import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse} from "@angular/common/http";
import {Observable, of} from "rxjs";
import {tap} from "rxjs";
import {share} from "rxjs";

@Injectable()
export class ImageCachingInterceptor implements HttpInterceptor {
  private cache: Map<string, HttpResponse<any>> = new Map();

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (req.method !== 'GET' || req.url.indexOf('image') == -1) {
      return next.handle(req);
    }

    // TODO: Delete cached images, once the documents are reviewed

    const cachedResponse: HttpResponse<any> | undefined = this.cache.get(req.url);

    if (cachedResponse) {
      return of(cachedResponse.clone());
    } else {
      return next.handle(req)
        .pipe(
          tap(stateEvent => {
            if (stateEvent instanceof HttpResponse) {
              this.cache.set(req.url, stateEvent.clone());
            }
          })
        ).pipe(
          share()
        )
    }
  }
}
