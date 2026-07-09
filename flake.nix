{
  description = "passcs-frontend";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
      in {
        packages.default = pkgs.stdenv.mkDerivation (finalAttrs: {
          pname = "passcs-frontend";
          version = "0.1.0";
          src = ./.;

          nativeBuildInputs = [
            pkgs.yarnConfigHook
            pkgs.yarnBuildHook
            pkgs.nodejs
          ];

          yarnOfflineCache = pkgs.fetchYarnDeps {
            yarnLock = ./yarn.lock;
            hash = "sha256-pFXrM7HBeMjsmDu50oHb860xpVUxFf2xOQDiaMrGius=";
          };

          env = {
            CI = "false";
            DISABLE_ESLINT_PLUGIN = "true";
          };

          installPhase = ''
            runHook preInstall
            mkdir -p $out
            cp -r build/. $out/
            runHook postInstall
          '';
        });

        devShells.default = pkgs.mkShell {
          packages = [
            pkgs.nodejs
            pkgs.yarn
          ];
        };
      });
}
