{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };
  outputs = { nixpkgs, flake-utils, ... }@inputs:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs {
          inherit system;
          config = {
            allowUnfree = true;
          };
        };
        devShell = pkgs.mkShell {
          shellHook = ''
            export COREPACK_DIR=$HOME/.local/share/corepack
            mkdir -p $COREPACK_DIR
            corepack enable --install-directory $COREPACK_DIR
            PATH=$COREPACK_DIR:$PATH
          '';
          buildInputs = with pkgs; [
            nodejs_22
          ];
        };
      in
      {
        formatter = pkgs.nixpkgs-fmt;
        devShell = devShell;
      }
    );
}
