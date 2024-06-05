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
				Url = "_content/HtmlEditor.Blazor/" +
				"css/default.css" },
		};
	}
}