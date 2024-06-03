using System;
using Oqtane.Models;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Oqtane.Documentation;

namespace ADefWebserver.Module.HtmlTextV2.Models
{
    [PrivateApi("Mark HtmlText classes as private, since it's not very useful in the public docs")]
    public class HtmlText : ModelBase
    {
        [Key]
        public int HtmlTextId { get; set; }
        public int ModuleId { get; set; }
        public string Content { get; set; }
    }
}
