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
                Url = "_content/HtmlEditor.Blazor/HtmlEditor.Blazor.js" },
            new Resource {
                ResourceType = ResourceType.Stylesheet,
                Url = "_content/HtmlEditor.Blazor/fonts/MaterialIcons-Regular.woff" },
            new Resource {
                ResourceType = ResourceType.Stylesheet,
                Url = "_content/HtmlEditor.Blazor/fonts/roboto-v15-latin-300.woff" },
            new Resource {
                ResourceType = ResourceType.Stylesheet,
                Url = "_content/HtmlEditor.Blazor/fonts/roboto-v15-latin-700.woff" },
            new Resource {
                ResourceType = ResourceType.Stylesheet,
                Url = "_content/HtmlEditor.Blazor/fonts/roboto-v15-latin-regular.woff" },
            new Resource {
                ResourceType = ResourceType.Stylesheet,
                Url = "_content/HtmlEditor.Blazor/fonts/SourceSansPro-Black.woff" },
            new Resource {
                ResourceType = ResourceType.Stylesheet,
                Url = "_content/HtmlEditor.Blazor/fonts/SourceSansPro-BlackIt.woff" },
            new Resource {
                ResourceType = ResourceType.Stylesheet,
                Url = "_content/HtmlEditor.Blazor/fonts/SourceSansPro-Bold.woff" },
            new Resource {
                ResourceType = ResourceType.Stylesheet,
                Url = "_content/HtmlEditor.Blazor/fonts/SourceSansPro-BoldIt.woff" },
            new Resource {
                ResourceType = ResourceType.Stylesheet,
                Url = "_content/HtmlEditor.Blazor/fonts/SourceSansPro-ExtraLight.woff" },
            new Resource {
                ResourceType = ResourceType.Stylesheet,
                Url = "_content/HtmlEditor.Blazor/fonts/SourceSansPro-ExtraLightIt.woff" },
            new Resource {
                ResourceType = ResourceType.Stylesheet,
                Url = "_content/HtmlEditor.Blazor/fonts/SourceSansPro-It.woff" },
            new Resource {
                ResourceType = ResourceType.Stylesheet,
                Url = "_content/HtmlEditor.Blazor/fonts/SourceSansPro-Light.woff" },
            new Resource {
                ResourceType = ResourceType.Stylesheet,
                Url = "_content/HtmlEditor.Blazor/fonts/SourceSansPro-LightIt.woff" },
            new Resource {
                ResourceType = ResourceType.Stylesheet,
                Url = "_content/HtmlEditor.Blazor/fonts/SourceSansPro-Regular.woff" },
            new Resource {
                ResourceType = ResourceType.Stylesheet,
                Url = "_content/HtmlEditor.Blazor/fonts/SourceSansPro-Semibold.woff" },
            new Resource {
                ResourceType = ResourceType.Stylesheet,
                Url = "_content/HtmlEditor.Blazor/fonts/SourceSansPro-SemiboldIt.woff" },
          }
        };
    }
}
