package cmd

import (
	"fmt"
	"os"

	"github.com/spf13/cobra"
)

var rootCmd = &cobra.Command{
	Use:   "codebhejo",
	Short: "Command line tool for sharing file",
}

func Execute() {
	err := rootCmd.Execute()
	if err != nil {
		os.Exit(1)
	}
}

func init() {
	rootCmd.CompletionOptions.DisableDefaultCmd = true
	rootCmd.AddCommand(versionCmd)
	rootCmd.AddCommand(sendCmd)
	rootCmd.AddCommand(receiveCmd)
}

var versionCmd = &cobra.Command{
	Use:   "version",
	Short: "Print the codebhejo version",
	Run: func(cmd *cobra.Command, args []string) {
		fmt.Println("codebhejo version", "v0.0.1")
	},
}
