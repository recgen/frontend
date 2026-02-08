{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/master";
    flake-utils.url = "github:numtide/flake-utils";
  };
  outputs = {
    nixpkgs,
    flake-utils,
    ...
  } @ inputs:
    with flake-utils.lib;
      eachSystem defaultSystems (
        system: let
          pkgs = import nixpkgs {inherit system;};
        in {
          devShells.default = pkgs.mkShell {
            packages = with pkgs; [
              bun
            ];
          };
        }
      );
}
