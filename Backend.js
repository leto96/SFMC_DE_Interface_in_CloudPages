// <script runat="server">
  Platform("Core", "2.0");
  var api = new Script.Util.WSProxy();
  
  try {
    var operationOnItem = Request.GetQueryStringParameter("item");
    if( operationOnItem != 'dataextension' && operationOnItem != 'folder' ){
      Platform.Function.RaiseError(Stringify({
        errorMessage: 'item not valid'
      }));
    }
    
    Write('operationOnItem\n');
    Write(Stringify(operationOnItem) + '\n');
    // var data = getPostData();
    // Write('data received');
    // Write(Stringify(data));
  } catch (error) {
    Write('error');
    Write(Stringify(error));
  }

  function getPostData(){
    var postData = Platform.Request.GetPostData(0);
    var parsedData = Platform.Function.ParseJSON( postData );
    return parsedData;
  }
// </script>