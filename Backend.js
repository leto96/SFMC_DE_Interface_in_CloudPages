// <script runat="server">
  Platform("Core", "2.0");
  var api = new Script.Util.WSProxy();
  
  try {
    var operationOnItem = Request.GetQueryStringParameter("item");
    var operationType = Request.GetQueryStringParameter("type");
    if( operationOnItem != 'dataextension' && operationOnItem != 'folder' ){
      Platform.Function.RaiseError('INVALID_ITEM');
    }

    if( operationType != 'retrieveWithName' && operationType != 'retrieveByID' ){
      Platform.Function.RaiseError('INVALID_OPERATION');
    }

    var result;
    if( operationOnItem == 'folder' ){
      switch( operationType ){
        case 'retrieveWithName':
          result = retrieveFolderByNameLike(api);
          sendResponse( reduceFolders(result) );
        case 'retrieveByID':
          result = retrieveFolderByID(api);
          sendResponse( reduceFolders(result) );
        default:
          Platform.Function.RaiseError('INVALID_OPERATION_ON_FOLDER');
          break;
      }
    } else { // Data Extension
      switch( operationType ){
        case 'retrieveWithName':
          result = retrieveDEByNameLike(api);
          sendResponse( reduceDEs(result) );
        default:
          Platform.Function.RaiseError('INVALID_OPERATION_ON_FOLDER');
          break;
      }
    }
    
  } catch (error) {
    Write('error\n');
    Write(Stringify(error.message));

  }

  // --------------- MAIN -------------------
  function retrieveDEByNameLike(api){
    var postedData = getPostData();
    var DENameToLookLike = postedData.name;
    
    if( DENameToLookLike == null || DENameToLookLike == undefined || DENameToLookLike.length < 4 ){
      Platform.Function.RaiseError('INVALID_SEARCH_NAME');
    }

    var DEsFound = DataExtensionCollection({api:api}).getDEWithNameLike(DENameToLookLike);
    return DEsFound;
  }
  
  function retrieveFolderByID(api){
    var postedData = getPostData();
    var folderIdToLookUp = postedData.id;
    
    if( folderIdToLookUp == null || folderIdToLookUp == undefined ){
      Platform.Function.RaiseError('INVALID_ID');
    }

    var foldersFound = DataExtensionFolders({api: api}).getFolderByID(folderIdToLookUp);
    return foldersFound;
  }

  function retrieveFolderByNameLike(api){
    var postedData = getPostData();
    var folderNameToLookLike = postedData.name;
    
    if( folderNameToLookLike == null || folderNameToLookLike == undefined || folderNameToLookLike.length < 4 ){
      Platform.Function.RaiseError('INVALID_SEARCH_NAME');
    }

    var foldersFound = DataExtensionFolders({api: api}).getFoldersByNameLike(folderNameToLookLike);
    return foldersFound;
  }

  function sendResponse(result){
    Write(Stringify(result));
  }

  // ---------------- AUX FUNCTIONS ----------------

  // Get data in post
  function getPostData(){
    var postData = Platform.Request.GetPostData(0);
    var parsedData = Platform.Function.ParseJSON( postData );
    return parsedData;
  }

  function reduceFolders(folders){
    return mapArray(folders, function(folder) {
      return {
        name: folder.Name,
        id: folder.ID,
        parentID: folder.ParentFolder.ID,
        dateCreated: folder.CreatedDate
      };
    });
  }

  function reduceDEs(DEs){
    return mapArray(DEs, function(de) {
      return {
        name: de.Name,
        customerKey: de.CustomerKey,
        folderID: de.CategoryID,
        dateCreated: de.CreatedDate
      };
    });
  }

  // ---------------- Library ----------------

  // Data Extension Folder Library
  function DataExtensionFolders(configuration){
    if(!configuration) Platform.Function.RaiseError('An configuration Object is required');
    if(!configuration.api) Platform.Function.RaiseError('Api attribute is required');
    
    var api = configuration.api;
    var headers = GlobalObject({api: api}).getAllRetrievableFields('DataFolder');
  
    function retrieveFoldersByName(name){
      // Filter to get the parent folder
      var folderFitler = {
        LeftOperand: {
          Property: "Name",
          SimpleOperator: 'equals',
          Value: name
        },
        LogicalOperator: "AND",
        RightOperand: {
          Property: "ContentType",
          SimpleOperator: 'equals',
          Value: 'dataextension'
        }
      };
  
      // Retrieve the parent folder
      var folderRetreiveResult = api.retrieve('DataFolder', headers,  folderFitler );
  
      return mapArray(folderRetreiveResult.Results, 
        function(val){ return generateFolderObject(val) });
    }
  
    function getFoldersByNameLike(name){
      // Filter to get the parent folder
      var folderFitler = {
        LeftOperand: {
          Property: "Name",
          SimpleOperator: 'like',
          Value: name
        },
        LogicalOperator: "AND",
        RightOperand: {
          Property: "ContentType",
          SimpleOperator: 'equals',
          Value: 'dataextension'
        }
      };
  
      // Retrieve the parent folder
      var folderRetreiveResult = api.retrieve('DataFolder', headers,  folderFitler );
  
      return mapArray(folderRetreiveResult.Results, 
        function(val){ return generateFolderObject(val) });
    }
  
    function getFolderByID(id){
      var folderFitler = {
        LeftOperand: {
          Property: "ID",
          SimpleOperator: 'equals',
          Value: id
        },
        LogicalOperator: "AND",
        RightOperand: {
          Property: "ContentType",
          SimpleOperator: 'equals',
          Value: 'dataextension'
        }
      };
  
      var folderRetreiveResult = api.retrieve('DataFolder', headers,  folderFitler);
      return mapArray(folderRetreiveResult.Results, function(val){ return generateFolderObject(val) });
      
    }
  
    function getInsideFolders(id){
      var folderFitler = {
        LeftOperand: {
          Property: "ParentFolder.ID",
          SimpleOperator: 'equals',
          Value: id
        },
        LogicalOperator: "AND",
        RightOperand: {
          Property: "ContentType",
          SimpleOperator: 'equals',
          Value: 'dataextension'
        }
      };
  
      var folderRetreiveResult = api.retrieve('DataFolder', headers,  folderFitler );
      return mapArray(folderRetreiveResult.Results, function(val){ generateFolderObject(val) });
    }
  
    function getDeepInsideFolders(id){
      var allFolders = [];
      var searchFolders = [id];
      var folderFitler = {
        LeftOperand: {
          Property: "ParentFolder.ID",
          SimpleOperator: 'equals',
          Value: folderParentID
        },
        LogicalOperator: "AND",
        RightOperand: {
          Property: "ContentType",
          SimpleOperator: 'equals',
          Value: 'dataextension'
        }
      }
  
      do{
        if(searchFolders.length < 2){
          folderFitler.LeftOperand.SimpleOperator = 'equals';
          folderFitler.LeftOperand.Value = searchFolders[0];
        }else{
          folderFitler.LeftOperand.SimpleOperator = 'IN';
          folderFitler.LeftOperand.Value = searchFolders;
        }
  
        var folderRetreiveResult = api.retrieve('DataFolder', headers,  folderFitler);
        
        mapArray(folderRetreiveResult.Results, function(val){ allFolders.push(generateFolderObject(val)); return null; });
        searchFolders = mapArray(folderRetreiveResult.Results, function(val){ return val.ID });
    
      }while(searchFolders.length > 0);
  
      return allFolders;
    }
  
    function mapArray(array, callback, thisArg) {
      var T, A, k;var O = array;var len = O.length;if (typeof callback !== 'function') {throw new TypeError(callback + ' is not a function');}if (arguments.length > 2) {T = thisArg;}A = [];k = 0;while (k < len) {var kValue, mappedValue;kValue = O[k];mappedValue = callback.call(T, O[k], k, O);A.push(mappedValue);k++;}return A;
    }
  
    function generateFolderObject(obj){
      return{
        ID: obj.ID,
        Name: obj.Name,
        Description: obj.Description,
        ContentType: obj.ContentType,
        IsActive: obj.IsActive,
        IsEditable: obj.IsEditable,
        AllowChildren: obj.AllowChildren,
        CreatedDate: obj.CreatedDate,
        ModifiedDate: obj.ModifiedDate,
        ObjectID: obj.ObjectID,
        CustomerKey: obj.CustomerKey,
        ParentFolder: {
          ID: obj.ParentFolder.ID,
          CustomerKey: obj.ParentFolder.CustomerKey,
          ObjectID: obj.ParentFolder.ObjectID,
          Name: obj.ParentFolder.Name,
          Description: obj.ParentFolder.Description,
          ContentType: obj.ParentFolder.ContentType,
          IsActive: obj.ParentFolder.IsActive,
          IsEditable: obj.ParentFolder.IsEditable,
          AllowChildren: obj.ParentFolder.AllowChildren
        },
        Client: {
          ID: obj.Client.ID,
          ModifiedBy: obj.Client.ModifiedBy,
          EnterpriseID: obj.Client.EnterpriseID,
          CreatedBy: obj.Client.CreatedBy
        }
      }
    }
  
    function GlobalObject(configuration){
      if(!configuration) Platform.Function.RaiseError('An configuration Object is required');
      if(!configuration.api) Platform.Function.RaiseError('Api attribute is required');
    
      function getAllRetrievableFields(objectType){
        if(objectType == null || objectType == '') Platform.Function.RaiseError('objectType is required');
        var lookedResponse = 'Error: The Request Property(s) ';
    
        var result = api.describe('DataFolder');
        var propertiesName = mapArray(result.Results[0].Properties, function(val){ return val.Name });
        
        var simpleFilterName = {
          Property: propertiesName[0],
          SimpleOperator: 'equals',
          Value: 'some_value'
        }
    
        var fieldsCheck = api.retrieve(objectType, propertiesName, simpleFilterName);
        
        if(!fieldsCheck.Status || fieldsCheck.Status.substring( 0, lookedResponse.length) != lookedResponse){
          // Platform.Function.RaiseError('Not Expected response when trying to get the headers.\n' + fieldsCheck);
          return ["ID"];
        }
        
        var treatedResponse = fieldsCheck.Status.replace(lookedResponse, '');
        var regex = /(\S+)/ig; // the first index will have the invalid fields
        var notValidFields = (treatedResponse.match(regex)[0]).split(',');
    
        return filterArray(propertiesName, function(val){ return indexOf(notValidFields, val) == -1 });
      }
    
      function mapArray(array, callback, thisArg) {
        var T, A, k;var O = array;var len = O.length;if (typeof callback !== 'function') {throw new TypeError(callback + ' is not a function');}if (arguments.length > 2) {T = thisArg;}A = [];k = 0;while (k < len) {var kValue, mappedValue;kValue = O[k];mappedValue = callback.call(T, O[k], k, O);A.push(mappedValue);k++;}return A;
      }
    
      function indexOf(arr, searchElement, fromIndex) {
        var k;var o = arr;var len = o.length;if (len == 0) {return -1;}var n = fromIndex || 0;if (n >= len) {return -1;}if(n >= 0){k = n;}else{k = Math.max(len - Math.abs(n), 0);}for (; k < len; k++) {if (k in o && o[k] == searchElement)return k;}return -1;
      }
    
      function filterArray(arr, callback) {
        if (!(!!arr && Object.prototype.toString.call(arr) == '[object Array]')) {throw new TypeError();}var t = arr;var len = t.length;if (typeof callback != 'function') {throw new TypeError();}var res = [];if (arguments.length >= 3) {var thisArg = arguments[2];}for (var i = 0; i < len; i++) {var val = t[i];if (callback.call(thisArg, val, i, t)) {res.push(val);}}return res;
      }
    
      return {
        getAllRetrievableFields: getAllRetrievableFields
      }
    }
  
    return {
      retrieveFoldersByName: retrieveFoldersByName,
      getFolderByID: getFolderByID,
      getInsideFolders: getInsideFolders,
      getDeepInsideFolders: getDeepInsideFolders,
      getFoldersByNameLike: getFoldersByNameLike
    }
  }

  // Aux to use Array.map
  function mapArray(array, callback, thisArg) {
    var T, A, k;var O = array;var len = O.length;if (typeof callback !== 'function') {throw new TypeError(callback + ' is not a function');}if (arguments.length > 2) {T = thisArg;}A = [];k = 0;while (k < len) {var kValue, mappedValue;kValue = O[k];mappedValue = callback.call(T, O[k], k, O);A.push(mappedValue);k++;}return A;
  }

  // Data Extension Finder
  function DataExtensionCollection(configuration) {
    if(!configuration) Platform.Function.RaiseError('An configuration Object is required');
    if(!configuration.api) Platform.Function.RaiseError('Api attribute is required');
    var api = configuration.api;
  
    // if(!customerKey && !name) Platform.Function.RaiseError('Either \"customerKey\" or \"name\" is required');
  
    function generateDataExtensionObject(obj){
      if(!obj) return;
      var formatedObject = {
        ObjectID: obj.ObjectID,
        PartnerKey: obj.PartnerKey,
        CustomerKey: obj.CustomerKey,
        Name: obj.Name,
        CreatedDate: obj.CreatedDate,
        ModifiedDate: obj.ModifiedDate,
        Description: obj.Description,
        IsSendable: obj.IsSendable,
        IsTestable: obj.IsTestable,
        CategoryID: obj.CategoryID,
        Status: obj.Status,
        IsPlatformObject: obj.IsPlatformObject,
        DataRetentionPeriodLength: obj.DataRetentionPeriodLength,
        DataRetentionPeriodUnitOfMeasure: obj.DataRetentionPeriodUnitOfMeasure,
        RowBasedRetention: obj.RowBasedRetention,
        ResetRetentionPeriodOnImport: obj.ResetRetentionPeriodOnImport,
        DeleteAtEndOfRetentionPeriod: obj.DeleteAtEndOfRetentionPeriod,
        RetainUntil: obj.RetainUntil,
        DataRetentionPeriod: obj.DataRetentionPeriod
      }
      if(obj.Template && obj.Template.CustomerKey){
        formatedObject.Template = {CustomerKey: obj.Template.CustomerKey};
      }else{
        formatedObject.Template = {CustomerKey: null};
      }
      if(obj.SendableSubscriberField && obj.SendableSubscriberField.Name){
        formatedObject.SendableSubscriberField = {Name: obj.SendableSubscriberField.Name};
      }else{
        formatedObject.SendableSubscriberField = {Name: null};
      }
      if(obj.SendableDataExtensionField && obj.SendableDataExtensionField.Name){
        formatedObject.SendableDataExtensionField = {Name: obj.SendableDataExtensionField.Name};
      }else{
        formatedObject.SendableDataExtensionField = {Name: null};
      }
      if(obj.Client && obj.Client.ID){
        formatedObject.Client = {ID: obj.Client.ID};
      }else{
        formatedObject.Client = {ID: null};
      }
  
      return formatedObject;
    }
  
    function retriveDEs(prop, operator, value){
      var retrieveFilter = {
        Property: prop,
        SimpleOperator: operator,
        Value: value
      };
  
      var retrievedDE = api.retrieve('DataExtension', [
        'ObjectID',
        'PartnerKey',
        'CustomerKey',
        'Name',
        'CreatedDate',
        'ModifiedDate',
        'Description',
        'IsSendable',
        'IsTestable',
        'CategoryID',
        'Status',
        'IsPlatformObject',
        'DataRetentionPeriodLength',
        'DataRetentionPeriodUnitOfMeasure',
        'RowBasedRetention',
        'ResetRetentionPeriodOnImport',
        'DeleteAtEndOfRetentionPeriod',
        'RetainUntil',
        'DataRetentionPeriod',
        'Template.CustomerKey',
        'SendableSubscriberField.Name',
        'SendableDataExtensionField.Name',
        'Client.ID'
        ], retrieveFilter
      );
      return retrievedDE.Results;
    }
  
    function getDEWithNameLike(name){
      var des = retriveDEs('Name', 'like', name);
  
      return mapArray(des, function(de){
        return generateDataExtensionObject(de);
      });
    }
  
    function mapArray(array, callback, thisArg) {
      var T, A, k;var O = array;var len = O.length;if (typeof callback !== 'function') {throw new TypeError(callback + ' is not a function');}if (arguments.length > 2) {T = thisArg;}A = [];k = 0;while (k < len) {var kValue, mappedValue;kValue = O[k];mappedValue = callback.call(T, O[k], k, O);A.push(mappedValue);k++;}return A;
    }
    
    return {
      getDEWithNameLike: getDEWithNameLike
    }
  }
// </script>