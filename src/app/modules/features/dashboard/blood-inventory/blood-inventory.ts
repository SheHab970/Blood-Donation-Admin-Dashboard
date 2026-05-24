import { Component, OnInit, inject } from '@angular/core';
import { Dialog } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { RatingModule } from 'primeng/rating';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-blood-inventory',
  imports: [ButtonModule, RatingModule, TableModule, TagModule, FormsModule, Dialog, InputTextModule],
  templateUrl: './blood-inventory.html',
  styleUrl: './blood-inventory.css',
})
export class BloodInventory {

  loading: boolean = false;
  visible: boolean = false;
  // FAKE BLOOD_INVENTORY DATA
  bloodInventory = [
    { 
      bloodType: 'A+',
      quantity: 45,
      status: 'AVAILABLE',
      expirtionDate: '2024-12-31' 
    },
    { 
      bloodType: 'A-',
      quantity: 15,
      status: 'LOW',
      expirtionDate: '2024-12-31' 
    },
    { 
      bloodType: 'B+',
      quantity: 25,
      status: 'LOW',
      expirtionDate: '2024-12-31' 
    },
    { 
      bloodType: 'B-',
      quantity: 58,
      status: 'AVAILABLE',
      expirtionDate: '2024-12-31' 
    },
    { 
      bloodType: 'AB-',
      quantity: 24,
      status: 'AVAILABLE',
      expirtionDate: '2024-12-31' 
    },
    { 
      bloodType: 'AB+',
      quantity: 30,
      status: 'LOW',
      expirtionDate: '2024-12-31' 
    },
    { 
      bloodType: 'O+',
      quantity: 5,
      status: 'CRITICAL',
      expirtionDate: '2024-12-31' 
    },
    { 
      bloodType: 'O-',
      quantity: 10,
      status: 'CRITICAL',
      expirtionDate: '2024-12-31' 
    },
  ]

  reloadData(): void {
    this.loading = true;
    // this.inventoryService.getInventory().subscribe(data => {
    //   this.bloodInventory = data;
    //   this.loading = false;
    // });
    setTimeout(() => this.loading = false, 800); // remove when API is ready
  }
  
  saveBag(): void {
    // this.inventoryService.addBag(this.newBag).subscribe(...)
    this.visible = false;
  }
  
  getSeverity(status: string): string {
    switch (status) {
      case 'Available': return 'success';
      case 'Low Stock':  return 'warn';
      case 'Critical':   return 'danger';
      case 'Expired':    return 'secondary';
      default:           return 'info';
    }
  }
    showDialog() {
        this.visible = true;
    }





}
