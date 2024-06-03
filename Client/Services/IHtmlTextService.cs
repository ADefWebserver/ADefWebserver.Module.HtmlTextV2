using System.Collections.Generic;
using System.Threading.Tasks;
using Oqtane.Documentation;

namespace ADefWebserver.Module.HtmlTextV2.Services
{
    [PrivateApi("Mark HtmlText classes as private, since it's not very useful in the public docs")]
    public interface IHtmlTextService 
    {
        Task<List<Models.HtmlText>> GetHtmlTextsAsync(int moduleId);

        Task<Models.HtmlText> GetHtmlTextAsync(int moduleId);

        Task<Models.HtmlText> GetHtmlTextAsync(int htmlTextId, int moduleId);

        Task<Models.HtmlText> AddHtmlTextAsync(Models.HtmlText htmltext);

        Task DeleteHtmlTextAsync(int htmlTextId, int moduleId);
    }
}
