from evaluation.test_cases import run_all_evaluations


def main():
    results = run_all_evaluations()

    passed = sum(
        result["passed"]
        for result in results
    )

    failed = len(results) - passed

    print()
    print("WorkMate AI Evaluation")
    print("=" * 40)

    for result in results:
        status = "PASS" if result["passed"] else "FAIL"

        print(
            f"[{status}] {result['name']}"
        )

    print()
    print("=" * 40)
    print(f"Total:  {len(results)}")
    print(f"Passed: {passed}")
    print(f"Failed: {failed}")

    if failed:
        raise SystemExit(1)

    print()
    print("All evaluations passed.")


if __name__ == "__main__":
    main()