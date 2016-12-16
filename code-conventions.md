# code style
in addition to the tslint rules, the following should apply:
* private class members are prefixed with _
* every getter/function must specify a return type
* use typed arg objects as arguments whenever appropriate
    * increases readability/usability if there are multiple arguments
    * increases backwards compatibility when you add optional arguments

# git commit message prefixes
a ! should be suffixed to a prefix to denote a breaking change
## **add**:
functionality is added
## **mod**:
functionality changes
## **del**:
functionality is removed
## **polish**:
changes/additions to improve clarity / follow conventions / cleanup the codebase:
* files/folders are moved/renamed
* classes/properties/methods/functions are renamed
* code guidelines are applied (e.g. tslint rules, file naming conventions, etc.)
* comments to illustrate functionality
* unused files/functions are removed