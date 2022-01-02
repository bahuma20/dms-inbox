import {BehaviorSubject, Observable} from "rxjs";
import {map} from 'rxjs/operators';
import {User} from "./model/User";
import {HttpClient} from "@angular/common/http";
import {environment} from "../environments/environment";
import {Injectable} from "@angular/core";

@Injectable({providedIn: 'root'})
export class AuthenticationService {
  private currentUserSubject: BehaviorSubject<User|null>;
  public currentUser: Observable<User|null>

  constructor(private http: HttpClient) {
    this.currentUserSubject = new BehaviorSubject<User|null>(JSON.parse(localStorage.getItem('currentUser') ?? '{}'));
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User|null {
    return this.currentUserSubject.value;
  }

  login(username: string, password: string) {
    return this.http.post<any>(`${environment.apiUrl}/auth/token/obtain/`, {
      username,
      password,
    })
      .pipe(map(user => {
        user.authdata = window.btoa(username + ':' + password);
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.currentUserSubject.next(user);
        return user;
      }));
  }

  logout() {
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }
}
