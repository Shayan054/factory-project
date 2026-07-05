from django.test import SimpleTestCase

from fact_app.permissions import CEOUpdateDestroyMixin, IsCEO


class CEOUpdateDestroyMixinTests(SimpleTestCase):
    def test_destroy_action_returns_ceo_permissions(self):
        view = type("View", (), {"action": "destroy"})()
        perms = CEOUpdateDestroyMixin.get_permissions(view)
        self.assertEqual(len(perms), 2)
        self.assertIsInstance(perms[1], IsCEO)
