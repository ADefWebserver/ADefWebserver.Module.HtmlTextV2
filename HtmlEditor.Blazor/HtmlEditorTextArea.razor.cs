using Microsoft.AspNetCore.Components;

namespace HtmlEditor.Blazor
{
    /// <summary>
    /// HtmlEditorTextArea component.
    /// </summary>
    /// <example>
    /// <code>
    /// &lt;HtmlEditorTextArea Cols="30" Rows="3" @bind-Value=@value Change=@(args => Console.WriteLine($"Value: {args}")) /&gt;
    /// </code>
    /// </example>
    public partial class HtmlEditorTextArea : FormComponent<string>
    {
        /// <summary>
        /// Gets or sets the maximum length.
        /// </summary>
        /// <value>The maximum length.</value>
        [Parameter]
        public long? MaxLength { get; set; }

        /// <summary>
        /// Gets or sets a value indicating whether is read only.
        /// </summary>
        /// <value><c>true</c> if is read only; otherwise, <c>false</c>.</value>
        [Parameter]
        public bool ReadOnly { get; set; }

        /// <summary>
        /// Gets or sets the number of rows.
        /// </summary>
        /// <value>The number of rows.</value>
        [Parameter]
        public int Rows { get; set; } = 2;

        /// <summary>
        /// Gets or sets the number of cols.
        /// </summary>
        /// <value>The number of cols.</value>
        [Parameter]
        public int Cols { get; set; } = 20;

        /// <summary>
        /// Handles the <see cref="E:Change" /> event.
        /// </summary>
        /// <param name="args">The <see cref="ChangeEventArgs"/> instance containing the event data.</param>
        protected async System.Threading.Tasks.Task OnChange(ChangeEventArgs args)
        {
            Value = $"{args.Value}";

            await ValueChanged.InvokeAsync(Value);
            if (FieldIdentifier.FieldName != null) { EditContext?.NotifyFieldChanged(FieldIdentifier); }
            await Change.InvokeAsync(Value);
        }

        /// <inheritdoc />
        protected override string GetComponentCssClass()
        {
            return GetClassList("html-editor-text-area").ToString();
        }

        ///// <inheritdoc />
        //protected override string GetId()
        //{
        //    return Name ?? base.GetId();
        //}
    }
}
