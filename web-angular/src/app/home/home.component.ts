import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  menuItems = [
    { index: 1, content: '自动关机部署', itemFunction: () => { this.router.navigateByUrl('shutdown') } },
    { index: 2, content: '网易云听歌记录', itemFunction: () => { this.router.navigateByUrl('history') } },
    { index: 3, content: 'Markdown', itemFunction: () => { this.router.navigateByUrl('markdown') } },
    { index: 4, content: '更多功能，敬请期待...' }
  ]

  constructor(private router: Router) { 
    this.router = router
  }

  ngOnInit(): void {
  }
}
