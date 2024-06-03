using Microsoft.JSInterop;
using System.Threading.Tasks;

namespace ADefWebserver.Module.HtmlTextV2
{
    public class Interop
    {
        private readonly IJSRuntime _jsRuntime;

        public Interop(IJSRuntime jsRuntime)
        {
            _jsRuntime = jsRuntime;
        }
    }
}
