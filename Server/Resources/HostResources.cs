using System.Collections.Generic;
using Oqtane.Infrastructure;
using Oqtane.Models;
using Oqtane.Shared;
namespace ADefWebserver.Module.HtmlTextV2
{
	public class HostResources : IHostResources
	{
		public List<Resource> Resources => new List<Resource>()
		{
            // New References:
            // The JavaScript files will automatically be pulled
            // so it does not need to be registered here
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
        };
	}
}