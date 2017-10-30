import { Component, OnInit, OnDestroy } from '@angular/core';
import { FetchAllFormsService } from '../../Services/fetch-all-forms.service';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { FetchFormDetailService } from '../../Services/fetch-form-detail.service';
import { LocalStorageService } from '../../Services/local-storage.service';
import { UpdateComponentService } from '../../Services/update-component.service';
import { FormListService } from '../../Services/form-list.service';
import { DialogService } from 'ng2-bootstrap-modal';
import { UpdateFormsWizardComponent } from '../../modals/update-forms-wizard-modal/update-forms-wizard-modal.component';
import * as _ from 'lodash';
@Component({
  selector: 'app-update-forms',
  templateUrl: './update-forms.component.html',
  styleUrls: ['./update-forms.component.css'],
})
export class UpdateFormsComponent implements OnInit,OnDestroy {

  subscription:Subscription;
  formSchemas:any[]=[];
  oldComponentUUID:any;
  newComponentUUID:any;
  newComponentMetadata:any;
  oldComponentMetadata:any;
  formsReferencingThisComponent:any[]=[];
  viewAlert:boolean=true;
  selectedForms:any[]=[];

  constructor(private fa:FetchAllFormsService,private route:ActivatedRoute,private fd:FetchFormDetailService,private ls:LocalStorageService,
  private formListService:FormListService,private router:Router,private updateComponentService:UpdateComponentService, private dialogService:DialogService) { }

  ngOnInit() {

    this.fa.getPOCFormSchemas().subscribe(res => {
        this.formSchemas = res;
        console.log('res');
    });

    this.subscription = this.route.params.subscribe((params) => {
      this.oldComponentUUID = params['oldUuid'];
      this.newComponentUUID = params['newUuid'];
      let forms = [];
      let count = 0;

      this.fd.fetchFormMetadata(this.newComponentUUID, true).then((res) => {
        this.newComponentMetadata = res;
      });
      this.fd.fetchFormMetadata(this.oldComponentUUID,true).then((res) => {
        this.oldComponentMetadata = res;
      });


      this.formSchemas.forEach((schema, index) => {
        let checkSchema = this.checkIfReferencesComponent(this.oldComponentUUID, schema);
        if (!_.isEmpty(checkSchema)) forms.push(checkSchema);
        count = index;
      });

      if (count == this.formSchemas.length - 1) {
        _.forEach(forms, (form) => {
          let name = this.formListService.removeVersionInformation(form['metadata']['name']);
          let versionsArr = [];
          _.forEach(forms, ($form, index) => {

            if (_.includes($form['metadata']['name'], name)) {
              versionsArr.push($form);
            }
            if (index == forms.length - 1) {
              let highestVersion = versionsArr.reduce((a, b) => parseFloat(a['metadata']['version']) > parseFloat(b['metadata']['version']) ? a : b);
              if(!_.includes(this.formsReferencingThisComponent,highestVersion)) this.formsReferencingThisComponent.push(highestVersion);
            }
          })
        });
      }

    });


}

checkIfReferencesComponent(componentUUID,form){

  let _schema = {}; 
  if(form['schema'].referencedForms){
    if(!_.isEmpty(form['schema'].referencedForms)){
      _.forEach(form['schema'].referencedForms,(refForm:any)=>{
        if(_.isEqual(refForm.ref.uuid,componentUUID)){
          _schema = form;
        }
      })
    }
  }
  return _schema;
} 


updateForms(){
  this.dialogService.addDialog(UpdateFormsWizardComponent,
    {componentMetadata:this.newComponentMetadata, oldComponentUUID:this.oldComponentUUID ,selectedForms:this.selectedForms},{backdropColor:"rgba(0,0,0,0.5)"})
    .subscribe((res) => {if(res) this.router.navigate(['/forms'])});
}


onChange(form,checked){
  if(checked){
    this.selectedForms.push(form);
  }
  else{
    if(_.includes(this.selectedForms,form))
      { let index = _.indexOf(this.selectedForms,form);
        this.selectedForms.splice(index,1);
      }}
}


ngOnDestroy(){
  this.subscription.unsubscribe();
}
}