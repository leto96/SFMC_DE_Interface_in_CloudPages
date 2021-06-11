// <script runat="server">
  Platform("Core", "2.0");
  var api = new Script.Util.WSProxy();
  
  try {
    var operationOnItem = Request.GetQueryStringParameter("item");
    var operationType = Request.GetQueryStringParameter("type");
    if( operationOnItem != 'dataextension' && operationOnItem != 'folder' ){
      Platform.Function.RaiseError('INVALID_ITEM');
    }

    if( operationType != 'retrieveWithName' ){
      Platform.Function.RaiseError('INVALID_OPERATION');
    }


    Write('operationOnItem\n');
    Write(Stringify(operationOnItem) + '\n');
    
  } catch (error) {
    Write('error\n');
    Write(Stringify(error.message));


  }

  function getPostData(){
    var postData = Platform.Request.GetPostData(0);
    var parsedData = Platform.Function.ParseJSON( postData );
    return parsedData;
  }
// </script>