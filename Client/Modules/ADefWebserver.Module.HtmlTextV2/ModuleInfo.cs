using Oqtane.Models;
using Oqtane.Modules;
using Oqtane.Shared;
using System.Collections.Generic;

namespace ADefWebserver.Module.HtmlTextV2
{
    public class ModuleInfo : IModule
    {
        public ModuleDefinition ModuleDefinition => new ModuleDefinition
        {
            Name = "HtmlTextV2",
            Description = "HTML Module",
            Version = "1.2.0",
            ServerManagerType = "ADefWebserver.Module.HtmlTextV2.Manager.HtmlTextV2Manager, ADefWebserver.Module.HtmlTextV2.Server.Oqtane",
            ReleaseVersions = "1.0.0,1.1.0,1.2.0",
            Dependencies = "ADefWebserver.Module.HtmlTextV2.Shared.Oqtane,HtmlEditor.Blazor,System.Linq.Dynamic.Core,Microsoft.CSharp",
            PackageName = "ADefWebserver.Module.HtmlTextV2",
            Resources = new List<Resource>()
          {
                new Resource {
                ResourceType = ResourceType.Stylesheet,
                Url = "_content/HtmlEditor.Blazor/css/default.css" },
            new Resource {
                ResourceType = ResourceType.Script,
                Url = "_content/HtmlEditor.Blazor/HtmlEditor.Blazor.js" }
          }
        };
    }
}
