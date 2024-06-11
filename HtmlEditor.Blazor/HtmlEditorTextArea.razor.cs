@using HtmlEditor.Blazor
@using Microsoft.AspNetCore.Components.Forms
@inherits FormComponent<string>
@if (Visible)
{
    <textarea @ref="@Element" id="@GetId()" disabled="@Disabled" readonly="@ReadOnly" name="@Name" rows="@Rows" cols="@Cols" style="@Style" @attributes="Attributes" class="@GetCssClass()"
              placeholder="Hello World!" maxlength="@MaxLength" value="@Value" @onchange="@OnChange" tabindex="@(Disabled ? "-1" : $"{TabIndex}")"></textarea>
}