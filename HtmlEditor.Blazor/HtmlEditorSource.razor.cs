using Microsoft.AspNetCore.Components;

namespace HtmlEditor.Blazor
{
    /// <summary>
    /// A tool which switches between rendered and source views in <see cref="HtmlEditor" />.
    /// </summary>
    public partial class HtmlEditorSource
    {

        /// <summary>
        /// Specifies the title (tooltip) displayed when the user hovers the tool. Set to <c>"View source"</c> by default.
        /// </summary>
        [Parameter]
        public string Title { get; set; } = "View source";

    }
}
